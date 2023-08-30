//@ts-check
// extension.js
import { async_getLlmManagerOobaboogaComponent } from "./component_LlmManager_Oobabooga"; 
import { LlmQueryComponent_Oobabooga } from "./component_LlmQuery_Oobabooga.js";


async function CreateComponents() 
{
  const LlmManagerOobaboogaComponent = await async_getLlmManagerOobaboogaComponent();
  const components = [LlmManagerOobaboogaComponent, LlmQueryComponent_Oobabooga ];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}