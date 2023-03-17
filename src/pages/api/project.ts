import { ProjectTemplate } from '@/constant/ProjectTemplate';
import { JWT } from '@/interfaces/auth.interface';
import { Tree } from '@/interfaces/workspace.interface';
import { ProjectModel } from '@/models/Project';
import { ProjectFileModel } from '@/models/ProjectFile';
import dbConnect from '@/utility/dbConnect';
import { authenticate } from '@/utility/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action } = req.body;

  try {
    const token = authenticate(req);
    await dbConnect();
    if (!token) {
      throw 'Login required';
    }

    let resposne = null;

    switch (action) {
      case 'clone-project':
        resposne = await cloneProject(req.body, token);
        break;

      case 'create-project':
        resposne = await createProject(req.body, token);
        break;
      case 'update-project':
        resposne = await updateProject(req.body, token);
        break;
      case 'list-projects':
        resposne = await listProject(token.id as string);
        break;

      default:
        throw 'Invalid action';
    }

    res.status(200).json({
      success: true,
      message: 'Successfull',
      data: resposne,
    });
  } catch (error: any) {
    let message = 'Something went wrong.';
    console.log('error', error);
    if (typeof error === 'string') {
      message = error;
    }
    return res.status(500).json({
      success: false,
      message,
    });
  } finally {
  }
}

const cloneProject = async (formData: any, token: JWT) => {
  const { projectId } = formData;

  const projectToClone = await ProjectModel.findById(projectId);
  if (!projectToClone || !projectToClone.isPublic) {
    throw 'Unauthorised access';
  }

  const newProject = await ProjectModel.create({
    name: projectToClone.name,
    userId: token.id,
  });
  newProject.save();

  const files = await ProjectFileModel.find({ projectId });
  const newFiles = files.map((file: any) => {
    return {
      name: file.name,
      parent: file.parent,
      type: file.type,
      path: file.path,
      content: file.content,
      projectId: newProject._id,
    };
  });

  const projectFiles = await ProjectFileModel.insertMany(newFiles);

  return {
    project: newProject.toJSON(),
    projectFiles: projectFiles,
  };
};

const listProject = async (userId: string) => {
  const project = await ProjectModel.find({ userId });
  return project || [];
};

const updateProject = async (formData: any, token: JWT) => {
  const { contractAddress, isPublic, projectId } = formData;
  if (!projectId) {
    throw 'Project and contract address required';
  }
  const project = await ProjectModel.findById(projectId);
  if (token.id != project.userId) {
    throw 'Unauthorised access';
  }
  if (contractAddress) {
    project.contractAddress = contractAddress;
  }
  if (typeof isPublic == 'boolean') {
    project.isPublic = isPublic;
  }
  await project.save();
};

const createProject = async (formData: any, token: JWT) => {
  const { name, template, contractAddress, projectId } = formData;

  let project: any;
  let projectFiles: any;

  project = await ProjectModel.create({
    userId: token.id,
    name: name || '',
    template: template || '',
    contractAddress: contractAddress || '',
  });
  await project.save();

  let selectedTemplateFiles: Tree[] = (
    ProjectTemplate[template as 'tonBlank' | 'tonCounter'] as any
  )['func'];

  selectedTemplateFiles = selectedTemplateFiles.map((file: any) => {
    const temp = file;
    delete temp['id'];
    return { ...temp, projectId: project._id };
  });
  projectFiles = await ProjectFileModel.insertMany(selectedTemplateFiles);

  return {
    project: project.toJSON(),
    projectFiles: projectFiles,
  };
};
