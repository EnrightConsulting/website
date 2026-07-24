(function(global){
  const weights={critical:400,high:300,medium:200,low:100};
  function normalizePriority(asset){
    if(asset.status==='service') return 'critical';
    if(asset.status==='attention') return 'high';
    return 'low';
  }
  function score(insight){
    const confidence=insight.confidence==='high'?30:insight.confidence==='medium'?15:5;
    const agePenalty=Math.min(20,Math.floor((Date.now()-new Date(insight.timestamp).getTime())/86400000));
    return (weights[insight.priority]||0)+confidence-agePenalty;
  }
  function fromAsset(asset,path){
    const priority=normalizePriority(asset);
    return {
      id:`asset-${asset.id}`,
      title:asset.nextAction||`${asset.shortName||asset.name} needs attention`,
      category:asset.category||'asset',
      source:'EnView Assets',
      priority,
      confidence:'high',
      summary:`${asset.shortName||asset.name} is marked ${asset.healthLabel||asset.status}.`,
      recommendation:asset.nextAction||'Review this asset today.',
      why:[
        `${asset.shortName||asset.name} is currently marked ${asset.healthLabel||asset.status}.`,
        `Location: ${path(asset.locationId)}.`,
        'Cortex ranked this above healthy assets because it requires attention.'
      ],
      assetId:asset.id,
      timestamp:new Date().toISOString()
    };
  }
  function healthyInsight(activeAssets){
    return {
      id:'system-healthy',title:'All active assets are healthy',category:'system',source:'EnView Cortex',priority:'low',confidence:'high',
      summary:`Cortex reviewed ${activeAssets.length} active ${activeAssets.length===1?'asset':'assets'} and found no urgent exceptions.`,
      recommendation:'Continue with planned work; no urgent asset action is required.',
      why:['No active asset is marked for service or attention.','Cortex only elevates exceptions that require action.'],timestamp:new Date().toISOString()
    };
  }
  function buildBriefing(db,path){
    const active=(db.assets||[]).filter(a=>(a.lifecycle||'active')==='active');
    let insights=active.filter(a=>a.status!=='healthy').map(a=>fromAsset(a,path));
    if(!insights.length) insights=[healthyInsight(active)];
    insights=insights.map(i=>({...i,score:score(i)})).sort((a,b)=>b.score-a.score);
    const actionable=insights.filter(i=>i.priority!=='low');
    return {
      generatedAt:new Date().toISOString(),
      hero:insights[0],
      insights,
      priorityCount:actionable.filter(i=>['critical','high'].includes(i.priority)).length,
      recommendationCount:actionable.length,
      overallHealth:actionable.some(i=>i.priority==='critical')?'Action required':actionable.length?'Attention needed':'All systems healthy'
    };
  }
  global.EnViewCortex={buildBriefing,score};
})(window);
