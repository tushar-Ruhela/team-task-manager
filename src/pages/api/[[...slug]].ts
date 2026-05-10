import type { NextApiRequest, NextApiResponse } from "next";
import app from "../../api_legacy/index";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    // Express app acts as a listener
    app(req as any, res as any, (err?: any) => {
      if (err) {
        return reject(err);
      }
      resolve(true);
    });
  });
}
