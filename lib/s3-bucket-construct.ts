import { RemovalPolicy } from "aws-cdk-lib";
import {
  AccountPrincipal,
  Effect,
  PolicyStatement,
  StarPrincipal,
} from "aws-cdk-lib/aws-iam";
import { BlockPublicAccess, Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface S3DevBucketConstructProps {}

export class S3DevBucketConstruct extends Construct {
  public readonly bucket: IBucket;
  constructor(
    scope: Construct,
    id: string,
    props: S3DevBucketConstructProps = {}
  ) {
    super(scope, id);

    const devAccountID: string = this.node.tryGetContext("devAccountID");
    const prodAccountID: string = this.node.tryGetContext("prodAccountID");
    const s3DevBucketARN: string = this.node.tryGetContext("s3DevBucketARN");
    const createDevBucket: string =
      this.node.tryGetContext("createDevBucket") || false;

    if (!s3DevBucketARN && createDevBucket) {
      this.bucket = new Bucket(this, "S3DevBucket", {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        removalPolicy: RemovalPolicy.RETAIN,
      });

      [
        new PolicyStatement({
          effect: Effect.DENY,
          sid: "DenyUnEncryptedObjectUploads",
          principals: [new StarPrincipal()],
          resources: [`arn:aws:iam::${devAccountID}:root`],
          actions: ["s3:PutObject"],
          conditions: {
            StringNotEquals: {
              "s3:x-amz-server-side-encryption": "aws:kms",
            },
          },
        }),
        new PolicyStatement({
          effect: Effect.DENY,
          sid: "DenyInsecureConnections",
          principals: [new StarPrincipal()],
          actions: ["s3:*"],
          resources: [`arn:aws:iam::${devAccountID}:root`],
          conditions: {
            Bool: {
              "aws:SecureTransport": "false",
            },
          },
        }),
        new PolicyStatement({
          sid: "AllowCrossAccountRWAccessForCodeDeployService",
          principals: [new AccountPrincipal(prodAccountID)],
          actions: ["s3:Get*"],
          resources: [s3DevBucketARN],
        }),
        new PolicyStatement({
          sid: "AllowCrossAccountListForCodeDeployService",
          principals: [new AccountPrincipal(prodAccountID)],
          actions: ["s3:ListBucket"],
          resources: [s3DevBucketARN],
        }),
      ].forEach((policyStatement) =>
        this.bucket.addToResourcePolicy(policyStatement)
      );
    } else {
      console.log(
        "No S3 Bucket was specified and it is not required to create one"
      );
      console.log(
        "Maybe you forgot to specify the 'createDevBucket' variable in cdk.context.json?"
      );
    }
  }
}
