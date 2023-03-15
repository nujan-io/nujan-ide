import { ProjectTemplate } from '@/constant/ProjectTemplate';
import { Tree } from '@/interfaces/workspace.interface';
import { ProjectModel } from '@/models/Project';
import { ProjectFileModel } from '@/models/ProjectFile';
import dbConnect from '@/utility/dbConnect';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, template, contractAddress, projectId } = req.body;

  try {
    await dbConnect();
    const token = await getToken({ req });
    if (!token) {
      throw 'Login required';
    }
    let project: any;
    let projectFiles: any;
    if (projectId && contractAddress) {
      project = await ProjectModel.findById(projectId);
      if (token.id === project.userId) {
        project.contractAddress = contractAddress;
      }
      await project.save();
    } else {
      project = await ProjectModel.create({
        userId: token.id,
        name: name || '',
        template: template || '',
        contractAddress: contractAddress || '',
      });
      let selectedTemplateFiles: Tree[] = (
        ProjectTemplate[template as 'tonBlank' | 'tonCounter'] as any
      )['func'];

      await project.save();

      selectedTemplateFiles = selectedTemplateFiles.map((file: any) => {
        const temp = file;
        delete temp['id'];
        return { ...temp, projectId: project._id };
      });
      projectFiles = await ProjectFileModel.insertMany(selectedTemplateFiles);
    }

    res.status(200).json({
      success: true,
      message: 'Successfull',
      data: {
        project: project.toJSON(),
        projectFiles: projectFiles,
      },
    });
  } catch (error: any) {
    if (error.message) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
    });
  } finally {
  }
}
