import { requireAuth } from '../../../src/middleware/requireAuth';
import BusinessProfile from '../../../models/BusinessProfile';
import Contact from '../../../models/Contact';
// …
export default requireAuth(async (req,res)=>{
  const { phone,name,description,address,website } = req.body;
  const ownerRef = (req as any).user.sub;
  const bp = await BusinessProfile.findOneAndUpdate(
    { phone },
    { phone,name,description,address,website,ownerRef },
    { upsert:true, new:true }
  );
  // also ensure Contact exists
  await Contact.findOneAndUpdate({ phone }, { phone,name,isRegistered:false },{upsert:true});
  res.json(bp);
});

