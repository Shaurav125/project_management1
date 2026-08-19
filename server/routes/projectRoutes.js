import express from "express";
import {
    addMember,
    removeMember,
    setProjectLead,
    createProject,
    updateProject,
    deleteProject
} from "../controllers/projectController.js";

const projectRouter = express.Router();

projectRouter.post("/", createProject);
projectRouter.put("/:projectId", updateProject);
projectRouter.put("/", updateProject);
projectRouter.delete("/delete", deleteProject);
projectRouter.delete("/:projectId", deleteProject);
projectRouter.delete("/", deleteProject);
projectRouter.post("/delete", deleteProject);
projectRouter.post("/:projectId/addMember", addMember);
projectRouter.post("/:projectId/removeMember", removeMember);
projectRouter.post("/:projectId/setLead", setProjectLead);

export default projectRouter;
