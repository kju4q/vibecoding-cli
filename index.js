import "dotenv/config";
import { Octokit } from "@octokit/rest";
import { program } from "commander";
import shell from "shelljs";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";

// Initialize Octokit with GitHub Token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

if (!process.env.GITHUB_TOKEN) {
  console.error("❌ GitHub Token is missing. Please add it to your .env file.");
  process.exit(1);
}

// Ensure correct Node.js version
const requiredNodeVersion = "18.18.0";
const currentNodeVersion = process.version.replace("v", "");

if (currentNodeVersion < requiredNodeVersion) {
  console.error(
    `❌ You need Node.js ${requiredNodeVersion} or higher to use this CLI.`
  );
  console.error(`⚡ Upgrade Node.js at: https://nodejs.org/`);
  process.exit(1);
}

// Ask the user to choose a framework
async function askFramework() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Choose a framework for your Vibe Coding project:",
      choices: ["React", "Next.js"],
    },
  ]);
  return answers.framework;
}

// Get GitHub username dynamically
async function getGitHubUsername() {
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    return user.login;
  } catch (error) {
    console.error("❌ Error fetching GitHub username:", error.message);
    process.exit(1);
  }
}

function getVercelLiveURL() {
  const output = shell.exec("vercel --prod", { silent: true }).stdout;
  const match = output.match(/https:\/\/[\w.-]+\.vercel\.app/);
  return match ? match[0] : chalk.red("Vercel deployment URL not found.");
}

program
  .command("start <projectName>")
  .description("Create a new GitHub repository and set up the project")
  .action(async (projectName) => {
    console.log(`🚀 Starting Vibe Coding project: ${projectName}`);
    await createGitHubRepo(projectName);
  });

async function createGitHubRepo(projectName) {
  console.log(
    `🚀 DEBUG: createGitHubRepo called with projectName: ${projectName}`
  );

  try {
    const framework = await askFramework();
    console.log(`🎨 DEBUG: User selected framework: ${framework}`);

    console.log("📦 Creating a new GitHub repository...");
    const response = await octokit.repos.createForAuthenticatedUser({
      name: projectName,
      private: false,
    });

    console.log(`✅ Repo created: ${response.data.html_url}`);

    console.log("🔄 Cloning repository locally...");
    shell.exec(`git clone ${response.data.clone_url}`);

    const repoPath = path.join(process.cwd(), projectName);
    const tempPath = path.join(os.tmpdir(), projectName);

    // Ensure tempPath is empty before generating project
    shell.rm("-rf", tempPath);
    shell.mkdir("-p", tempPath);

    console.log(`📂 Using temporary directory for project setup: ${tempPath}`);

    // Set up the framework in the temporary directory
    setupFramework(framework, tempPath);

    // Move files from temp directory to the cloned repo
    console.log("🚚 Moving project files into the cloned GitHub repo...");
    shell.mv(`${tempPath}/*`, repoPath);
    shell.cd(repoPath);

    // Get GitHub username dynamically
    const username = await getGitHubUsername();

    // Reinitialize Git
    shell.exec("rm -rf .git");
    shell.exec("git init");
    fs.writeFileSync(".gitignore", "node_modules/\n.vercel\n", { flag: "w" });

    shell.exec("git add . -f -- ':!node_modules/'", { silent: true });
    shell.exec('git commit -m "Initial commit with selected framework"', {
      silent: true,
    });
    shell.exec(`git branch -M main`);
    shell.exec(
      `git remote add origin https://github.com/${username}/${projectName}.git`
    );
    shell.exec("git push -u origin main");

    console.log("🚀 Project is set up and pushed to GitHub!");

    console.log("🌎 Deploying project to Vercel...");
    checkVercelLogin();
    shell.exec("vercel --prod --yes");

    const vercelURL = getVercelLiveURL();
    console.log(
      chalk.bgBlue.white.bold(`🎉 Your project is live at → ${vercelURL}`)
    );
  } catch (error) {
    console.error("❌ Error creating GitHub repository:", error.message);
    process.exit(1);
  }
}

// Inject the cute Vibe Coding animation into the project
function addVibeAnimation(filePath, framework) {
  let content = "";

  if (framework === "React") {
    content = `  
  function App() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #89CFF0, #FFB6C1)',
        color: '#333',
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",
        fontSize: "20px",
      }}>
        <h1>You're now Vibe Coding</h1>
        <p>Build cool things, experiment, and let AI guide your creativity.</p>
      </div>
    );
  }
  
  export default App;
  `;
  } else if (framework === "Next.js") {
    content = `
  export default function Page() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #89CFF0, #FFB6C1)',
        color: '#333',
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",
        fontSize: "20px",
      }}>
        <h1>You're now Vibe Coding</h1>
        <p>Build cool things, experiment, and let AI guide your creativity.</p>
      </div>
    );
  }
  `;
  }

  fs.writeFileSync(filePath, content, "utf8");
}

// Set up the chosen framework (React or Next.js)
function setupFramework(framework, projectPath) {
  console.log(`🎨 Setting up ${framework} project in ${projectPath}...`);
  shell.cd(projectPath);

  if (framework === "React") {
    shell.exec("npm create vite@latest . -- --template react-ts --force", {
      silent: true,
    });
    addVibeAnimation(path.join(projectPath, "src/App.tsx"), "React");
  } else if (framework === "Next.js") {
    shell.exec("npx create-next-app@latest . --ts --use-npm --yes --force", {
      silent: true,
    });
    addVibeAnimation(path.join(projectPath, "src/app/page.tsx"), "Next.js");
  }
}

// Check if the user is logged into Vercel
function checkVercelLogin() {
  console.log("🔍 Checking for Vercel CLI...");

  // Check if Vercel CLI is installed
  const vercelInstalled = shell
    .exec("which vercel", { silent: true })
    .stdout.trim();
  if (!vercelInstalled) {
    console.error("❌ Vercel CLI is not installed. Install it using:");
    console.error("   npm install -g vercel");
    process.exit(1);
  }

  console.log("✅ Vercel CLI detected!");

  // Check if the user is logged into Vercel
  const loginCheck = shell
    .exec("vercel whoami", { silent: true })
    .stdout.trim();
  if (!loginCheck) {
    console.log(
      "🔑 You are not logged into Vercel. Automatically logging in with GitHub..."
    );

    // ✅ Force login with GitHub (no user prompt)
    shell.exec("vercel login --github", { silent: false });

    // ✅ Verify login again
    const retryLoginCheck = shell
      .exec("vercel whoami", { silent: true })
      .stdout.trim();
    if (!retryLoginCheck) {
      console.error(
        "❌ Vercel login failed. Please check your GitHub authentication."
      );
      process.exit(1);
    }
  } else {
    console.log(`✅ Logged into Vercel as ${loginCheck}`);
  }
}
// function checkVercelLogin() {
//   console.log("🔍 Checking for Vercel CLI...");

//   const vercelInstalled = shell
//     .exec("which vercel", { silent: true })
//     .stdout.trim();
//   if (!vercelInstalled) {
//     console.error("❌ Vercel CLI is not installed. Install it using:");
//     console.error("   npm install -g vercel");
//     process.exit(1);
//   }

//   console.log("✅ Vercel CLI detected!");
//   const loginCheck = shell
//     .exec("vercel whoami", { silent: true })
//     .stdout.trim();
//   if (!loginCheck) {
//     console.log("🔑 You are not logged into Vercel. Please log in:");
//     shell.exec("vercel login");
//   } else {
//     console.log(`✅ Logged into Vercel as ${loginCheck}`);
//   }
// }

// Ensure the CLI command executes correctly
(async () => {
  await program.parseAsync(process.argv);
})();
