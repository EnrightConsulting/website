export const InsightPriority={CRITICAL:'critical',HIGH:'high',MEDIUM:'medium',LOW:'low'};
export function createInsight(data){return {...data,timestamp:data.timestamp||new Date().toISOString()};}
