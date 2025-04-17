# Team3-PhysicsAIModel-Intelligraph
This AgenticAI model helps students retain major physics concepts, as well as answering questions that they need help on. The model provides students with an idea of the kind of thinking they should have when looking at a physics problem. This physics machine learning model can be very helpful for students that are aiming to ETAM into their desired major as well, it is very well defined for introductory physics courses such as Phys206 and Phys207.

## Benchmarks to test the AI model are:
Past common exams from Phys206
Past common exams from Pys207
We'll use these exams as data, and evaluate our Physics model depending on how well it can answer the questions (How much questions does it answer correctly)

## Summarizing the Physics AI Model:
The model is composed of the following:
- Problem Solver: (A student can input any question they want to clear up about physics: mathematical or conceptual questions)
- Generate Mindmap: You can provide it with a PDF file of your presentation slides from class and it will give you an idea of all the concepts that you should learn to prepare for the exam
- Formula Sheet Interpreter: You can provide it with a PDF file of the formula sheet for your exam, and it will parse all the formulas, explain what eahc of the variables mean, what units they use, things you should watch out for when using this formula, and how to use this formula in a physics problem



## Guide to loading and running the PhysicsAI model into your local device
Do all the steps IN ORDER if you want run the model:

### Loading the modules for the program and VSCode: ####

Click on the hamburger button + Terminal + New Terminal:
(Type whatever is to the right of >, which represents each different command in the terminal you need)
> cd project

> npm install 

This should install all the modules from the json files

Make sure you stay in the project directory
These are modules that you need have installed for this project manually because they are not 
in the json files

Finally, install:
> npm install cors



### Running the program (to see how the website looks like): ####

> cd project

> npm run dev 

(CLick on the link it tells you to go to)




### Using the OpenAI API Key for it to answer the questions, analyze the files ###
**ONLY DO THIS STEP IF** npm run dev is runnning correctly (You can clearly see the website with no issues)

Create a file 'config.js' in the project directory (in the same directory as server.js, not in src)

How 'config.js' should look like (Simple):

> config.js

export const OPENAI_API_KEY = sk-etc //(Your API KEY)

**VERY IMPORTANT NOTE: DON"T SHARE YOUR API KEY WITH ANYONE, SO **DO NOT UPLOAD/COMMIT 'config.js' TO GITHUB** (You can only upload it if you ERASE your API Key from there) **
If you keep the config.js to yourself when you're working on the project, it is guaranteed to be safe (DON'T UPLOAD YOUR API KEY ANYWHERE)

Now that you have config.js:
Open a New terminal (You should have two terminals open now -> the one where you opened the website with the npm run dev + this new one):
> node server.js

This should enable OPENAI to answer the questions or analyze the files you input into the website
