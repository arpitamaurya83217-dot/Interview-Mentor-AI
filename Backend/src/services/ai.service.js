const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
  matchScore: z.number(),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string()
    }).strict()
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string()
    }).strict()
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"])
    }).strict()
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string())
    }).strict()
  ),
  title: z.string()
}).strict();



async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate interview report STRICTLY according to provided schema:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

             STRICT RULES:

                - Return ONLY valid JSON
                - No markdown
                - No explanation
                - No code block
                - No extra text
                - Follow schema EXACTLY
                - Every array item MUST be a JSON object
                - Never return flattened arrays
                - Never return:
                ["question","What is React?","intention","..."]

                CORRECT EXAMPLE:

                {
                "title": "Full Stack Developer Interview Report",
                "matchScore": 85,
                "technicalQuestions": [
                    {
                    "question": "What is React?",
                    "intention": "Check React knowledge",
                    "answer": "Explain components and Virtual DOM"
                    }
                ],
                "behavioralQuestions": [
                    {
                    "question": "Tell me about yourself",
                    "intention": "Assess communication skills",
                    "answer": "Provide concise professional summary"
                    }
                ],
                "skillGaps": [
                    {
                    "skill": "Docker",
                    "severity": "medium"
                    }
                ],
                "preparationPlan": [
                    {
                    "day": 1,
                    "focus": "React Fundamentals",
                    "tasks": [
                        "Study React Components",
                        "Practice Hooks"
                    ]
                    }
                ]
                }

                INCORRECT EXAMPLE:

                {
                "technicalQuestions": [
                    "question",
                    "What is React?",
                    "intention",
                    "Check React knowledge"
                ]
                }

                DO NOT GENERATE THE INCORRECT FORMAT.
                ALL ITEMS INSIDE ARRAYS MUST BE JSON OBJECTS.
              
                          
`
 try{

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })
        console.log("Gemini Responded");
        console.log(response.text);

        const parsedResponse = JSON.parse(response.text)

        const validation =
            interviewReportSchema.safeParse(parsedResponse)

        if (!validation.success) {

            console.log("Schema Error")

            console.log(
                validation.error.format()
            )

            throw new Error(
                "Invalid Gemini Response"
            )
        }

return validation.data


}catch (error) {

        console.log("Gemini Error:", error.message)

        return {
            title: "Temporary Error",
            matchScore: 0,
            technicalQuestions: [],
            behavioralQuestions: [],
            skillGaps: [],
            preparationPlan: []
        }
    }
}
async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = {
    generateInterviewReport ,
    generateResumePdf
}