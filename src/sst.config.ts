// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

const region = (process.env.REGION || "ap-southeast-2") as aws.Region;
const acmName = process.env.ACM_NAME || "cdn.p2-sandbox.practera.com";
const stackName = process.env.STACK_NAME || "p2-sandbox";
const environment = process.env.ENV || "dev";
const endpoint = process.env.ENDPOINT || "projecthub.p2-sandbox.practera.com";

export default $config({
  app(input) {
    return {
      name: "projecthub",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: region,
          endpoints: [
            {
              dynamodb: `https://dynamodb.${region}.amazonaws.com`,
            },
          ],
        },
      },
    };
  },
  async run() {
    // certificate must be in us-east-1 for cloudfront
    const usEast1Provider = new aws.Provider("us-east-1-provider", {
      region: "us-east-1",
    });

    const certificate = await aws.acm.getCertificate(
      {
        domain: acmName,
        statuses: ["ISSUED"],
        mostRecent: true,
      },
      { provider: usEast1Provider }
    );

    // security group
    const securityGroup = await aws.ec2.getSecurityGroup({
      filters: [
        {
          name: "tag:Name",
          values: [`${stackName}-DBClientSecurityGroup-${environment}`],
        },
      ],
    });

    // private subnets
    const privateSubnets = await aws.ec2.getSubnets({
      filters: [
        {
          name: "tag:Env",
          values: [environment],
        },
        {
          name: "tag:Reach",
          values: ["private"],
        },
        {
          name: "tag:StackName",
          values: [stackName],
        },
      ],
    });

    new sst.aws.Nextjs("ProjectHub", {
      dev: false,
      invalidation: {
        paths: ["/*"],
        wait: true,
      },
      domain: {
        name: endpoint,
        cert: certificate.arn,
      },
      imageOptimization: {
        staticEtag: true,
        memory: "1 GB",
      },
      vpc: {
        securityGroups: [securityGroup.id],
        privateSubnets: privateSubnets.ids,
      },
    });
  },
});
