import { Artifacts, Project, PipelineProject, Source , LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { Artifact, Pipeline  } from "aws-cdk-lib/aws-codepipeline";
import { CodePipeline,CodePipelineSource, ShellStep,ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  GitHubSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
//import { PipelineAppStage } from './stage';
import { SecretValue } from "aws-cdk-lib";

interface CodePipelineConstructProps {
  sourceRepository: IRepository;
  pipelineServiceRole: IRole;
  codeBuildServiceRole: IRole;
  artifactBucket: IBucket;
}

export class CodePipelineConstruct extends Construct {
  public readonly pipeline: CodePipeline;
  constructor(scope: Construct, id: string, props: CodePipelineConstructProps) {
    super(scope, id);

    const codePipelineContext = this.node.tryGetContext("codepipeline");
    
/*
    const sourceArtifact = new Artifact(
      `${props.sourceRepository.repositoryName}-${new Date()}`
    );

    this.pipeline = new CodePipeline(this, "CodePipeline", {
      pipelineName: codePipelineContext.pipelineName,
      crossAccountKeys:false,
    });
      
      /*restartExecutionOnUpdate: codePipelineContext.restartExecutionOnUpdate,
      role: props.pipelineServiceRole,
      artifactBucket: props.artifactBucket, 
*/
      
      const pipeline = new Pipeline(this, "CodePipeline", {
        pipelineName: codePipelineContext.pipelineName,
        crossAccountKeys: false,
      });

    const sourceOutput = new Artifact("SourceOutput");

     pipeline.addStage({
      stageName: "Source",
      actions: [
        new GitHubSourceAction({
          owner: "m-saha",
          repo: "aws-pipeline",
          branch: "main",
          actionName: "Pipeline_Source",
          oauthToken: SecretValue.secretsManager("github-token"),
          output: sourceOutput,
        }),
      ],
    });

    const cdkBuildOutput = new Artifact("CdkBuildOutput");

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "CDK_Build",
          input: sourceOutput,
          outputs: [cdkBuildOutput],
          project: new PipelineProject(this, "CdkBuildProject", {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              "build spec/cdk-build-spec.yml"
            ),
          }),
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Update_Pipeline",
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "Pipeline_Update",
          stackName: "PipelineStack",
          templatePath: cdkBuildOutput.atPath("CdkCicdPipelineStack.template.json"),
          adminPermissions: true, // roles to add for strict permission
        }),
      ],
    });


      

    /*const preProd = new PipelineStages(this, 'PreProd');
    const prod = new PipelineStages(this, 'Prod');

    this.pipeline.addStage(prod, {
      post: [
        new pipelines.ManualApprovalStep('PromoteToProd'),
      ],
    });
    */
  }
}
