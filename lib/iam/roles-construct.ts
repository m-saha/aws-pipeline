import {
  IRole,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import codePipelineServiceRolePolicy from "./policies/codepipeline-service-role-policy.json";
import codeBuildServiceRolePolicy from "./policies/codebuild-service-role-policy.json";
import { Key } from "aws-cdk-lib/aws-kms";
import { IBucket } from "aws-cdk-lib/aws-s3";
import fs = require('fs');


interface IAMRolesConstructProps {
  s3DevBucket: IBucket;
}

export class IAMRolesConstruct extends Construct {
  public readonly codePipelineServiceRole: IRole;
  public readonly codePipelineTriggerCloudWatchRole: IRole;
  public readonly codePipelineCrossAccountRole: IRole;
  public readonly codeBuildServiceRole: IRole;
  public readonly codeDeployServiceRole: IRole;
  public readonly ec2InstanceServiceRole: IRole;

  constructor(scope: Construct, id: string, props?: IAMRolesConstructProps) {
    super(scope, id);
    
  
    const devAccountID: string = this.node.tryGetContext("devAccountID");
    // Either passed to the stack via cdk.context.json or created on the fly
    const kmsKeyARN: string =
      this.node.tryGetContext("kmsKeyARN") ||
      new Key(this, "KMSKey", {
        enabled: true,
        enableKeyRotation: true,
      }).keyArn;

    

    this.codePipelineServiceRole = new Role(this, "CodePipelineServiceRole", {
      assumedBy: new ServicePrincipal("codepipeline.amazonaws.com"),
      inlinePolicies: {
        policy: PolicyDocument.fromJson(JSON.parse(fs.readFileSync("lib/iam/policies/codepipeline-service-role-policy.json", 'utf-8'))),
      },
    });
    /*
    this.codePipelineTriggerCloudWatchRole = new Role(
      this,
      "CodePipelineTriggerCloudWatchRole",
      {
        assumedBy: new ServicePrincipal("codepipeline.amazonaws.com"),
        inlinePolicies: {
          policy: new PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: ["codepipeline:StartPipelineExecution"],
                resources: [`arn:aws:iam::${devAccountID}:root`],
              }),
            ],
          }),
        },
      }
    );
    */
  /*
    this.codePipelineCrossAccountRole = new Role(
      this,
      "CodePipelineCrossAccountRole",
      {
        assumedBy: new ServicePrincipal("codepipeline.amazonaws.com"),
        inlinePolicies: {
          policy: new PolicyDocument({
            statements: [
              new PolicyStatement({
                sid: "AllowCodeDeployServiceListS3Objects",
                actions: [
                  "s3:GetObject*",
                  "codecommit:ListBranches",
                  "codecommit:ListRepositories",
                ],
                resources: [
                  props?.s3DevBucket.bucketArn!,
                  props?.s3DevBucket.arnForObjects("*")!,
                ],
              }),
              new PolicyStatement({
                sid: "AllowCodeDeployServiceDeployment",
                actions: [
                  "codedeploy:CreateDeployment",
                  "codedeploy:GetDeployment",
                  "codedeploy:GetDeploymentConfig",
                  "codedeploy:GetApplicationRevision",
                  "codedeploy:RegisterApplicationRevision",
                ],
                resources: ["*"],
              }),
            ],
          }),
        },
      }
    );
*/
    this.codeBuildServiceRole = new Role(this, "CodeBuildServiceRole", {
      assumedBy: new ServicePrincipal("codebuild.amazonaws.com"),
      inlinePolicies: {
        policy: PolicyDocument.fromJson(JSON.parse(fs.readFileSync("lib/iam/policies/codebuild-service-role-policy.json", 'utf-8'))),
      },
    });

    this.codeDeployServiceRole = new Role(this, "CodeDeployServiceRole", {
      assumedBy: new ServicePrincipal("codedeploy.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSCodeDeployRole"
        ),
      ],
    });
    

   /*this.ec2InstanceServiceRole = new Role(this, "Ec2InstanceServiceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      inlinePolicies: {
        policy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              sid: "AllowAccesstoKMSKeyToDecryptArtefact",
              actions: [
                "kms:DescribeKey",
                "kms:GenerateDataKey*",
                "kms:Encrypt",
                "kms:ReEncrypt*",
                "kms:Decrypt",
              ],
              resources: [kmsKeyARN],
            }),
            new PolicyStatement({
              sid: "AllowListS3Objects",
              actions: ["s3:Get*"],
              resources: [
                props?.s3DevBucket.bucketArn!,
                props?.s3DevBucket.arnForObjects("*")!,
              ],
            }),
          ],
        }),
      },
    });*/
  }
}
