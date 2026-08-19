import express from "express";
import {
    getUserWorkspaces,
    addWorkspaceMember,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/", createWorkspace);
workspaceRouter.put("/:workspaceId", updateWorkspace);
workspaceRouter.put("/", updateWorkspace);
workspaceRouter.delete("/delete", deleteWorkspace);
workspaceRouter.delete("/:workspaceId", deleteWorkspace);
workspaceRouter.delete("/", deleteWorkspace);
workspaceRouter.post("/delete", deleteWorkspace);
workspaceRouter.post("/addMember", addWorkspaceMember);
workspaceRouter.post("/:workspaceId/members", addWorkspaceMember);

export default workspaceRouter;
