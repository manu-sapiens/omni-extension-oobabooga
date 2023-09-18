//@ts-check
//llm_Oobabooga.js
import { runBlock } from 'omnilib-utils/blocks.js';
import { Llm, generateModelId, deduceLlmTitle, deduceLlmDescription, addLocalLlmChoices, DEFAULT_UNKNOWN_CONTEXT_SIZE} from 'omnilib-llms/llm.js'
import { Tokenizer_Openai } from 'omnilib-llms/tokenizer_Openai.js' // TBD: use llama tokenizer: https://github.com/belladoreai/llama-tokenizer-js
export const MODEL_PROVIDER = "oobabooga";
export const PROVIDER_NAME = "Oobabooga";
const LLM_MODEL_TYPE_OOBABOOGA = "oobabooga";
const BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT = "oobabooga.simpleGenerateText";
const BLOCK_OOBABOOGA_MANAGE_MODEL = "oobabooga.manageModelComponent";
const ICON_OOBABOOGA = '📁';

function parseModelResponse(model_response)
{
   
    return model_response;

}

export class Llm_Oobabooga extends Llm
{
    constructor()
    {
        const tokenizer_Openai = new Tokenizer_Openai()
        // TBD: use Llama tokenizer

        super(tokenizer_Openai);
    }

    // -----------------------------------------------------------------------
    /**
     * @param {any} ctx
     * @param {string} prompt
     * @param {string} instruction
     * @param {string} model_name
     * @param {number} [temperature=0]
     * @param {any} [args=null]
     * @returns {Promise<{ answer_text: string; answer_json: any; }>}
     */
    async query(ctx, prompt, instruction, model_name, temperature=0.7, args=null)
    {
        // for now, for this to work we need:
        // 1. at least one model manually copied into oobabbooga's models directory
        // 2. in oobabooga session tab, options --api and --listen checked (or used as cmdline parameters when launching oobabooga)

        await this.loadModelIfNeeded(ctx, model_name);
        const max_new_tokens = args?.max_new_tokens_max || 2000;
        const negative_prompt = args?.negative_prompt || "";
        const seed = args?.seed || -1;


        args.user = ctx.userId;
        if ("max_new_tokens" in args == false) args.max_new_tokens = max_new_tokens;
        if ("negative_prompt" in args == false) args.negative_prompt = negative_prompt;
        if ("seed" in args == false) args.seed = seed;

        if ("prompt" in args == false) args.prompt = `${instruction}\n\n${prompt}`; // It is possible to overwrite the prompt by passing it as a parameter in args
        if ("temperature" in args == false) args.temperature = temperature;

        const response = await runBlock(ctx, BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT, args);
        if (response.error) throw new Error(response.error);

        const results = response?.results || [];
        if (results.length == 0) throw new Error("No results returned from oobabooga");

        const answer_text = results[0].text || null;
        if (!answer_text) throw new Error("Empty text result returned from oobabooga.");

        args.answer_text = answer_text;
      
        const return_value = {
            answer_text: answer_text,
            answer_json: args,
        };

        return return_value;
    }

    getProvider()
    {
        return MODEL_PROVIDER;
    }

    getModelType()
    {
        return LLM_MODEL_TYPE_OOBABOOGA;
    }

    async getModelChoices(choices, llm_model_types, llm_context_sizes)
    {
        await addLocalLlmChoices(choices, llm_model_types, llm_context_sizes, LLM_MODEL_TYPE_OOBABOOGA, MODEL_PROVIDER);
    }

    // -------------------------------------------------

    async getCurrentModelInfoFromServer(ctx)
    {
        const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "info" });

        // format:
        // {'model_name': shared.model_name,
        //  'lora_names': shared.lora_names,
        //  'shared.settings': shared.settings,
        //  'shared.args': vars(shared.args),}

        const model_response = response?.result;
        const model_info = parseModelResponse(model_response);
        return model_info;
    }

    async loadModelOnServer(ctx, model_name, loading_args)
    {
        const block_args = {...loading_args};
        block_args.model_name = model_name;
        block_args.action = "load";

        const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, block_args);
        const model_response = response?.result;
        const model_info = parseModelResponse(model_response);
        return model_info;
    }

    async getModelChoicesFromServer(ctx, choices, llm_model_types, llm_context_sizes)
    {
        const model_names = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "list" });

        for (const model_name in model_names)
        {
            let title, description, model_type, context_size, memory_need;

            const model_id = generateModelId(model_name, MODEL_PROVIDER)

            title = deduceLlmTitle(model_name, MODEL_PROVIDER, ICON_OOBABOOGA);
            description = deduceLlmDescription(model_name);

            llm_model_types[model_name] = LLM_MODEL_TYPE_OOBABOOGA;
            llm_context_sizes[model_name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;

            const choice = { value: model_id, title: title, description: description };
            choices.push(choice);
        }
    }

    async loadModelIfNeeded(ctx, model_name, loading_args)
    {
        let model_info = await this.getCurrentModelInfoFromServer(ctx);

        let loaded_model = model_info?.model_name;
        const context_size = this.getModelContextSizeFromModelInfo(model_info);
        if (context_size) this.context_sizes[model_name] = context_size;

        // TBD: a limitation is that a model that is loaded won't be reloaded with new loading arguments
        // TBD: we can have a refresh if loaded boolean to go around this
        // TBD: and use an unloading command to unload a model

        if (loaded_model != model_name)
        {
            model_info = await this.loadModelOnServer(ctx, model_name, loading_args);
            loaded_model = model_info?.model_name;
        }

        if (loaded_model != model_name) throw new Error (`Failed to load model ${model_name} into oobabooga`);

        return model_info;
    }

    getModelContextSizeFromModelInfo(model_info)
    {
        const context_size = model_info?.shared_settings?.max_new_tokens_max;
        return context_size;
    }

}
