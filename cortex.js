import {mockInsights} from './mock-insights.js';
const order={critical:4,high:3,medium:2,low:1};
export function getDailyBriefing(){
 const insights=[...mockInsights].sort((a,b)=>order[b.priority]-order[a.priority]);
 return {
   insight: insights[0],
   priorities: insights.filter(i=>order[i.priority]>=3),
   recommendations: insights.map(i=>i.recommendation),
   connectedServices:'Mock services healthy'
 };
}