// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "projecthub",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "ap-southeast-2",
          endpoints: [
            {
              dynamodb: "https://dynamodb.ap-southeast-2.amazonaws.com",
            },
          ],
        },
      },
    };
  },
  async run() {
    new sst.aws.Nextjs("ProjectHub", {
      dev: false,
      invalidation: {
        paths: ["/*"],
        wait: true,
      },
      domain: {
        name: "projecthub.p2-sandbox.practera.com",
        cert: "arn:aws:acm:us-east-1:977349090554:certificate/b5d27c49-7fc5-4357-8a4c-83e7329b01cf",
      },
      imageOptimization: {
        staticEtag: true,
        memory: "10240 MB",
      },
      transform: {
        cdn: (args) => {
          args.defaultCacheBehavior = {
            ...args.defaultCacheBehavior,
            cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6", // CachingOptimized
            compress: true,
          };
        },
      },
    });
  },
});
