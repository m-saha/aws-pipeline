import { Artifacts, Project, Source } from "aws-cdk-lib/aws-codebuild";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";

import {
  CodeBuildAction,
  CodeCommitSourceAction,
  CodeCommitTrigger,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface CodePipelineConstructProps {
  sourceRepository: IRepository;
  pipelineServiceRole: IRole;
  codeBuildServiceRole: IRole;
  artifactBucket: IBucket;
}

export class CodePipelineConstruct extends Construct {
  public readonly pipeline: Pipeline;
  constructor(scope: Construct, id: string, props: CodePipelineConstructProps) {
    super(scope, id);

    const codePipelineContext = this.node.tryGetContext("codepipeline");

    const sourceArtifact = new Artifact(
      `${props.sourceRepository.repositoryName}-${new Date()}`
    );

    this.pipeline = new Pipeline(this, "CodePipeline", {
      pipelineName: codePipelineContext.pipelineName,
      restartExecutionOnUpdate: codePipelineContext.restartExecutionOnUpdate,
      role: props.pipelineServiceRole,
      artifactBucket: props.artifactBucket,
      stages: [
        {
          stageName: "Source",
          actions: [
            new CodeCommitSourceAction({
              actionName: "Source",
              repository: props.sourceRepository,
              output: sourceArtifact,
              trigger: CodeCommitTrigger.EVENTS,
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: "Documentation",
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
