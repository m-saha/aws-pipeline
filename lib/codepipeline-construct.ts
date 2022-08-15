import { Artifacts, Project, PipelineProject, Source , LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { Artifact, Pipeline  } from "aws-cdk-lib/aws-codepipeline";
import { CodePipeline,CodePipelineSource, ShellStep,ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import {
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
    

    const sourceArtifact = new Artifact(
      `${props.sourceRepository.repositoryName}-${new Date()}`
    );

    /*this.pipeline = new CodePipeline(this, "CodePipeline", {
      pipelineName: codePipelineContext.pipelineName,
      crossAccountKeys:false,
    });
      
      /*restartExecutionOnUpdate: codePipelineContext.restartExecutionOnUpdate,
      role: props.pipelineServiceRole,
      artifactBucket: props.artifactBucket, 
      */
      
      const pipeline = new Pipeline(this, "Pipeline", {
        pipelineName: "Pipeline",
        crossAccountKeys: false,
      });

    const sourceOutput = new Artifact("SourceOutput");

     pipeline.addStage({
      stageName: "Source",
      actions: [
        new GitHubSourceAction({
          owner: "m-saha",
          repo: "aws-pipeline",
          branch: "master",
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
              "build-specs/cdk-build-spec.yml"
            ),
          }),
        }),
      ],
    });


      /*  {
          stageName: "Build",
          actions: [
            new CodeBuildAction({
              actionName: "create-typedoc",
              input: sourceArtifact,
              project: new Project(this, "Documentation Build project", {
                projectName: "synth-build-project",
                role: props.codeBuildServiceRole,
                artifacts: Artifacts.s3({
                  bucket: props.artifactBucket,
                  packageZip: true,
                  path: "/builds/zipFiles/",
                }),
                source: Source.codeCommit({
                  repository: props.sourceRepository,
                  branchOrRef: "master",
                }),
              }),
            }),
          ],
        },
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
