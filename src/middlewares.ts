export default function notFound(req: { originalUrl: any; }, res: { status: (arg0: number) => void; }, next: (arg0: Error) => void) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

/* eslint-disable no-unused-vars */
export function errorHandler(err: { message: any; stack: any; }, req: any, res: { statusCode: number; status: (arg0: any) => void; json: (arg0: { message: any; stack: any; }) => void; }, next: any) {
  /* eslint-enable no-unused-vars */
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
}

