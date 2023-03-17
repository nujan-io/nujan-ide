import { Project } from '@/interfaces/workspace.interface';
import { ProjectModel } from '@/models/Project';
import { ProjectFileModel } from '@/models/ProjectFile';
import dbConnect from '@/utility/dbConnect';
import { authenticate } from '@/utility/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import { JWT } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action } = req.body;

  try {
    let token;
    await dbConnect();

    if (action !== 'list-files') {
      token = authenticate(req);
    }

    let resposne = null;

    switch (action) {
      case 'list-files':
        resposne = await listFiles(req.body, token, res);
        break;
      case 'create-file':
        resposne = await createFile(req.body, token as JWT);
        break;
      case 'update-file':
        resposne = await updateFile(req.body, token as JWT);
        break;
      case 'delete-file':
        resposne = await deleteFile(req.body, token as JWT);
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
    console.log('error', error);
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

const listFiles = async (
  { projectId }: { projectId: Project['id'] },
  token: JWT | null,
  res: NextApiResponse
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    res.status(404).json({
      success: false,
      message: 'Failed',
      data: '',
    });
    throw 'Failed';
  }

  if (!token && !project.isPublic) {
    throw 'Login required ';
  }

  const files = await ProjectFileModel.find({ projectId });

  if (!files) {
    res.status(404).json({
      success: false,
      message: 'Failed',
      data: '',
    });
    return;
  }

  return files;
};

const createFile = async (formData: any, token: JWT) => {
  const { name, path, parent, projectId, type } = formData;
  if (!name || !path) {
    throw 'File name and path required';
  }

  const project = await ProjectModel.findById(projectId);

  if (token.id != project.userId) {
    throw 'Unauthorised access';
  }

  const file = await ProjectFileModel.create({
    projectId,
    name: name,
    parent: parent || null,
    type: type,
    path: path,
    content: '',
  });
  await file.save();
  return file;
};

const updateFile = async (formData: any, token: JWT) => {
  const { name, path, content, id } = formData;

  const file = await ProjectFileModel.findById(id);
  if (!file) {
    throw 'File not found';
  }
  const project = await ProjectModel.findById(file.projectId);

  if (token.id != project.userId) {
    throw 'Unauthorised access';
  }
  if (name) {
    file.name = name;
  }
  if (path) {
    file.path = path;
  }
  if (content) {
    file.content = content;
  }
  await file.save();
  return;
};

const deleteFile = async (formData: any, token: JWT) => {
  const { id } = formData;

  const file = await ProjectFileModel.findById(id);
  if (!file) {
    throw 'File not found';
  }
  const project = await ProjectModel.findById(file.projectId);

  if (token.id != project.userId) {
    throw 'Unauthorised access';
  }

  // TODO: If it is a directory then delete all it's child also
  await ProjectFileModel.deleteMany({ _id: [id] });

  return;
};
