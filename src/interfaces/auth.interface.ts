export interface AuthInterface {
  id?: string;
  walletAddress?: string;
  token?: string;
}

export interface JWT {
  token: string;
  id: string;
  walletAddress: string;
}
