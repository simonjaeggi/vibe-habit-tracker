import { ExpressAdapter } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/bootstrap';
import express, { Request, Response } from 'express';

type Handler = (req: Request, res: Response) => void | Promise<void>;

let cachedHandler: Handler | undefined;
let cachedApp: INestApplication | undefined;

async function bootstrap(): Promise<Handler> {
  const expressServer = express();
  const adapter = new ExpressAdapter(expressServer);
  const app = await createApp(adapter);

  // In serverless mode Nest must be fully initialized before handling requests.
  await app.init();
  cachedApp = app;

  const expressHandler = adapter.getInstance();

  return (req: Request, res: Response) => expressHandler(req, res);
}

export default async function handler(
  req: Request,
  res: Response,
) {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }

  return cachedHandler(req, res);
}
