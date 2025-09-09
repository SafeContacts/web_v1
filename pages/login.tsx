import { useState } from 'react';
import axios from 'axios';
import { Box, Input, Button, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function Login() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();

  const sendOtp = async () => {
    await axios.post('/api/auth/send-otp', { phone });
    setStep(2);
  };

  const verifyOtp = async () => {
    const res = await axios.post('/api/auth/verify-otp', { phone, otp });
    localStorage.setItem('token', res.data.accessToken);
    router.push('/');
  };

  return (
    <Box p={6}>
      <VStack spacing={4}>
        {step === 1 ? (
          <>
            <Input placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)} />
            <Button onClick={sendOtp}>Send OTP</Button>
          </>
        ) : (
          <>
            <Input placeholder="OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
            <Button onClick={verifyOtp}>Verify OTP</Button>
          </>
        )}
      </VStack>
    </Box>
  );
}
