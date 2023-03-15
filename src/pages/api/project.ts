import { ProjectTemplate } from '@/constant/ProjectTemplate';
import { Tree } from '@/interfaces/workspace.interface';
import { ProjectModel } from '@/models/Project';
import { ProjectFileModel } from '@/models/ProjectFile';
import dbConnect from '@/utility/dbConnect';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken, JWT } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action } = req.body;

  try {
    await dbConnect();
    const token = await getToken({ req });
    if (!token) {
      throw 'Login required';
    }

    let resposne = null;

    switch (action) {
      case 'create-project':
        resposne = await createProject(req.body, token);
        break;
      case 'update-project':
        resposne = await updateProject(req.body, token);
        break;

      default:
        break;
    }

    res.status(200).json({
      success: true,
      message: 'Successfull',
      data: resposne,
    });
  } catch (error: any) {
    let message = 'Something went wrong.';
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

const updateProject = async (formData: any, token: JWT) => {
  const { contractAddress, projectId } = formData;
  if (!projectId || !contractAddress) {
    throw 'Project and contract address required';
  }
  const project = await ProjectModel.findById(projectId);
  if (token.id != project.userId) {
    throw 'Unauthorised access';
  }
  project.contractAddress = contractAddress;
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
