import nodemailer from "nodemailer";

const getTransporter = () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    if (!smtpUser || !smtpPass) {
        return null;
    }

    try {
        return nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    } catch (e) {
        console.warn("Failed to initialize nodemailer transporter:", e.message);
        return null;
    }
};

export const sendEmail = async ({ to, subject, body }) => {
    if (!to) {
        console.warn("[Email Service] No recipient email provided");
        return { success: false, message: "No recipient email provided" };
    }

    const transporter = getTransporter();
    const sender = process.env.SENDER_EMAIL || process.env.SMTP_USER || "notifications@projectmanagement.app";

    console.log(`[Email Dispatch] Sending to: ${to} | Subject: "${subject}"`);

    if (!transporter) {
        console.log(`[SMTP Notice] Email prepared for ${to} (${subject}). Configure SMTP_USER and SMTP_PASS in Settings to send via real inbox.`);
        return { success: true, simulated: true, to, subject };
    }

    try {
        const response = await transporter.sendMail({
            from: `"${process.env.APP_NAME || "Task Planner"}" <${sender}>`,
            to,
            subject,
            html: body,
        });
        console.log(`[Email Success] Delivered to ${to}, MessageId:`, response.messageId);
        return { success: true, messageId: response.messageId };
    } catch (error) {
        console.warn(`[Email Error] Failed to send email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

export const sendTaskAssignmentEmail = async ({ assigneeEmail, assigneeName, taskTitle, taskDescription, projectName, dueDate, priority, taskUrl }) => {
    if (!assigneeEmail) return;

    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No due date";
    const subject = `New Task Assignment: ${taskTitle} (${projectName || "Project"})`;

    const body = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #172b4d;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px 32px; color: #ffffff;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px;">
                    Task Assignment & Invite
                </span>
                <h1 style="font-size: 22px; font-weight: 700; margin: 12px 0 4px 0; color: #ffffff;">You have a new task</h1>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">In project: <strong>${projectName || "General"}</strong></p>
            </div>
            
            <div style="padding: 32px;">
                <p style="font-size: 15px; margin-top: 0;">Hi <strong>${assigneeName || assigneeEmail}</strong> 👋,</p>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                    You have been assigned to join and collaborate on the following task:
                </p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">
                        ${taskTitle}
                    </h2>
                    ${taskDescription ? `<p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0;">${taskDescription}</p>` : ''}
                    
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; font-size: 13px; color: #475569;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 4px 0; font-weight: 600; width: 100px;">Priority:</td>
                                <td style="padding: 4px 0;"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${priority || "MEDIUM"}</span></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-weight: 600;">Due Date:</td>
                                <td style="padding: 4px 0; color: #0f172a;">${formattedDate}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 32px 0 16px 0;">
                    <a href="${taskUrl}" style="background-color: #2563eb; color: #ffffff; padding: 13px 30px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block;">
                        Open & View Task
                    </a>
                </div>
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; line-height: 1.4;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${taskUrl}" style="color: #2563eb; word-break: break-all;">${taskUrl}</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({ to: assigneeEmail, subject, body });
};

export const sendProjectInviteEmail = async ({ memberEmail, memberName, projectName, projectUrl, inviterName }) => {
    if (!memberEmail) return;

    const subject = `Invitation to join project "${projectName}"`;
    const body = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #172b4d;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #4f46e5, #4338ca); padding: 24px 32px; color: #ffffff;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px;">
                    Project Invitation
                </span>
                <h1 style="font-size: 22px; font-weight: 700; margin: 12px 0 4px 0; color: #ffffff;">You've been invited to join a project</h1>
            </div>
            <div style="padding: 32px;">
                <p style="font-size: 15px;">Hi <strong>${memberName || memberEmail}</strong> 👋,</p>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                    ${inviterName ? `<strong>${inviterName}</strong>` : "A team member"} has invited you to collaborate on the project <strong>${projectName}</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0 16px 0;">
                    <a href="${projectUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 13px 30px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block;">
                        Join & View Project
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({ to: memberEmail, subject, body });
};

export const sendWorkspaceInviteEmail = async ({ memberEmail, memberName, workspaceName, workspaceUrl, role }) => {
    if (!memberEmail) return;

    const subject = `You're invited to join workspace "${workspaceName}"`;
    const body = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #172b4d;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 24px 32px; color: #ffffff;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px;">
                    Workspace Invitation
                </span>
                <h1 style="font-size: 22px; font-weight: 700; margin: 12px 0 4px 0; color: #ffffff;">Welcome to ${workspaceName}</h1>
            </div>
            <div style="padding: 32px;">
                <p style="font-size: 15px;">Hi <strong>${memberName || memberEmail}</strong> 👋,</p>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                    You have been invited to join the workspace <strong>${workspaceName}</strong> as a <strong>${role || "Member"}</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0 16px 0;">
                    <a href="${workspaceUrl}" style="background-color: #0284c7; color: #ffffff; padding: 13px 30px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; display: inline-block;">
                        Enter Workspace
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({ to: memberEmail, subject, body });
};

export default sendEmail;


