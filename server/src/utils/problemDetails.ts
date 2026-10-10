import { Response, Request } from 'express';

export interface ProblemDetailsOptions {
  type?: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  instance?: string;
  invalidParams?: Array<{ field: string; message: string }>;
  extras?: Record<string, any>;
}

export class ProblemDetailsException extends Error {
  public status: number;
  public code: string;
  public title: string;
  public detail: string;
  public type: string;
  public invalidParams?: Array<{ field: string; message: string }>;
  public extras?: Record<string, any>;

  constructor(options: ProblemDetailsOptions) {
    super(options.detail);
    this.status = options.status;
    this.code = options.code;
    this.title = options.title;
    this.detail = options.detail;
    this.type = options.type || `https://madrasaos.ai/errors/${options.code}`;
    this.invalidParams = options.invalidParams;
    this.extras = options.extras;
  }
}

export function sendProblemDetails(res: Response, req: Request, options: ProblemDetailsOptions): Response {
  const instance = options.instance || req.originalUrl || req.url;
  const type = options.type || `https://madrasaos.ai/errors/${options.code}`;

  res.setHeader('Content-Type', 'application/problem+json');
  return res.status(options.status).json({
    type,
    title: options.title,
    status: options.status,
    detail: options.detail,
    instance,
    code: options.code,
    ...(options.invalidParams ? { invalidParams: options.invalidParams } : {}),
    ...(options.extras ? options.extras : {})
  });
}
