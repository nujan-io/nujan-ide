import { UserModel } from '@/models/User';
import dbConnect from '@/utility/dbConnect';
import { generateAccessToken } from '@/utility/jwt';
import {
  ConvertTonProofMessage,
  CreateMessage,
  SignatureVerify,
} from '@/utility/tonProof';
import { TonProofItemReplySuccess } from '@tonconnect/protocol';
import { Wallet } from '@tonconnect/sdk';
import axios from 'axios';
import { randomBytes } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action, data } = req.body;

  try {
    await dbConnect();

    let resposne = null;

    switch (action) {
      case 'generate-payload':
        resposne = await generatePayload();
        break;
      case 'verify-proof':
        resposne = await verifyProof(data);
        break;

      default:
        throw 'Invalid action';
    }

    res.status(200).json({
      success: true,
      message: 'Successfull',
      data: resposne,
    });
  } catch (error: any) {
    let message = 'Something went wrong.';
    console.log('error', error);
    if (typeof error === 'string') {
      message = error;
    }
    return res.status(500).json({
      success: false,
      message,
    });
  } finally {
  }
}

const generatePayload = async () => {
  // TODO: Store this nonce in database and use it during verification
  let payload = randomBytes(50).toString('base64');
  return { payload };
};

const verifyProof = async (walletPayload: any) => {
  const walletInfo = walletPayload as Wallet;
  if (!walletInfo?.connectItems?.tonProof) {
    throw 'Bad Request';
  }
  const proof = walletInfo.connectItems.tonProof as TonProofItemReplySuccess;
  if (!proof) {
    throw 'Bad Request';
  }

  const { data } = await axios(
    `https://${
      walletInfo.account.chain === '-3' ? 'testnet.' : ''
    }tonapi.io/v1/wallet/getWalletPublicKey?account=${encodeURI(
      walletInfo.account.address
    )}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY || ''}`,
      },
    }
  );
  const pubkey = Buffer.from(data.publicKey, 'hex');

  const parsedMessage = ConvertTonProofMessage(walletInfo, proof);
  const checkMessage = await CreateMessage(parsedMessage);

  const verifyRes = SignatureVerify(
    pubkey,
    checkMessage,
    parsedMessage.Signature
  );
  if (!verifyRes) {
    throw 'Bad Request. Invalid signature';
  }

  const walletAddress = walletInfo.account.address;
  let user;
  try {
    user = await UserModel.create({ walletAddress });
    await user.save();
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      user = await UserModel.findOne({ walletAddress });
    }
  }

  const userDetails = {
    id: user._id,
    walletAddress,
  };

  const token = generateAccessToken(userDetails);
  return { token, user: userDetails };
};
