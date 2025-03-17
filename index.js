import "dotenv/config";
import { Octokit } from "@octokit/rest";
import { program } from "commander";
import shell from "shelljs";

// Initialize Octokit with GitHub Token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

if (!process.env.GITHUB_TOKEN) {
  console.error("GitHub Token is missing. Please add it to your .env file.");
  process.exit(1);
}

program
  .command("start <projectName>")
  .description("Create a new GitHub repository and set up the project")
  .action(async (projectName) => {
    console.log(`🚀 Starting Vibe Coding project: ${projectName}`);
    await createGitHubRepo(projectName);
  });

async function createGitHubRepo(projectName) {
  try {
    // Step 1: Check if repo already exists
    const { data: existingRepos } =
      await octokit.repos.listForAuthenticatedUser();
    const repoExists = existingRepos.some((repo) => repo.name === projectName);

    if (repoExists) {
      console.error(`Repo "${projectName}" already exists on GitHub.`);
      process.exit(1);
    }

    // Step 2: Create a new repository
    console.log("📦 Creating a new GitHub repository...");
    const response = await octokit.repos.createForAuthenticatedUser({
      name: projectName,
      private: false,
    });

    console.log(`✅ Repo created: ${response.data.html_url}`);

    // Step 3: Clone the repository
    console.log("🔄 Cloning repository locally...");
    shell.exec(`git clone ${response.data.clone_url}`);

    console.log(`📂 Repository "${projectName}" cloned successfully!`);

    // Step 4: Initialize a basic README file
    shell.cd(projectName);
    shell.exec("echo '# " + projectName + "' > README.md");
    shell.exec("git add .");
    shell.exec('git commit -m "Initial commit from Vibe Coding CLI"');
    shell.exec("git push origin main");

    console.log("🚀 Project is set up and pushed to GitHub!");
  } catch (error) {
    console.error("Error creating GitHub repository:", error.message);
    process.exit(1);
  }
}

program.parse(process.argv);
