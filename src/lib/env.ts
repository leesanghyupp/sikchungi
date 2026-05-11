import "server-only";

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
};

export const env = {
  googleApiKey: required("GOOGLE_API_KEY"),
  unsplashAccessKey: required("UNSPLASH_ACCESS_KEY"),
  kakaoRestApiKey: required("KAKAO_REST_API_KEY"),
};
