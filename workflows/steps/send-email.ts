import { Resend } from 'resend';
import { FatalError } from 'workflow'; 

export async function sendEmail(fromEmail: string, toEmail: string, subject: string, html: string) {
    "use step"
  
    console.log(process.env.RESEND_API_KEY)

    const resend = new Resend(process.env.RESEND_API_KEY);
  
    const resp = await resend.emails.send({
      from: fromEmail, //'Acme <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html,
    });
  
    if (resp.error) {
      throw new FatalError(resp.error.message);
    }
};