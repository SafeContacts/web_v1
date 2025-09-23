import BusinessProfile from '../../../models/BusinessProfile';
export default async (req,res)=>{
  const q = req.query.q as string||'';
  const list = await BusinessProfile.find({ name: new RegExp(q,'i'), verified:true }).lean();
  res.json(list);
};

