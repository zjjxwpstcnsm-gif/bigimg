export interface Job { pixels: Uint8ClampedArray; width:number; height:number; modelId:string; scale:2|4; tile:number; overlap:number; backend:'auto'|'wasm'; baseUrl:string }
export interface Progress { stage:string; percent:number; processed?:number; total?:number; backend?:string; tile?:number; note?:string }
export type EngineMessage = {type:'progress';value:Progress}|{type:'done';pixels:Uint8ClampedArray;width:number;height:number;ms:number;backend:string;tile:number}|{type:'error';message:string;detail:string}
