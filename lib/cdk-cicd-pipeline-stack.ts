import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CodeCommitConstruct } from "./codecommit-construct";
import { CodePipelineConstruct } from "./codepipeline-construct";
import { IAMRolesConstruct } from "./iam/roles-construct";
import { S3DevBucketConstruct } from "./s3-bucket-construct";

export class CdkCicdPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const iamConstruct = new IAMRolesConstruct(this, "IAMRolesConstruct");
    const ccConstruct = new CodeCommitConstruct(this, "CodeCommitConstruct");
    const s3Construct = new S3DevBucketConstruct(this, "S3DevBucketConstruct");

    const cpConstruct = new CodePipelineConstruct(
      this,
      "CodePipelineConstruct",
      {
        sourceRepository: ccConstruct.repo,
        pipelineServiceRole: iamConstruct.codePipelineServiceRole,
        codeBuildServiceRole: iamConstruct.codeBuildServiceRole,
        artifactBucket: s3Construct.bucket,
      }
    );
  }
}
