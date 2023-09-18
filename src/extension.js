//@ts-check
// extension.js
import { async_getLlmManagerComponent_Oobabooga } from "./component_LlmManager_Oobabooga"; 
import { get_LlmQueryComponent_Oobabooga } from "./component_LlmQuery_Oobabooga.js";

async function CreateComponents() 
{
  const LlmManagerComponent_Oobabooga = await async_getLlmManagerComponent_Oobabooga();
  const LlmQueryComponent_Oobabooga = await get_LlmQueryComponent_Oobabooga();
  const components = [LlmManagerComponent_Oobabooga, LlmQueryComponent_Oobabooga ];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}