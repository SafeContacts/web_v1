import { requireAuth } from '../../../../src/middleware/requireAuth';
import UserActivity   from '../../../../models/UserActivity';
export default requireAuth(async (_,res)=>{
  const since = new Date(Date.now() - 24*3600*1000);
  const dau   = await UserActivity.distinct('userId',{ type:'login', createdAt:{ $gte:since } });
  res.json({ dau:dau.length });
});

