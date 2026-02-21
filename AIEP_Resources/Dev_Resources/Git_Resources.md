# Git Resources!

## Links -
- [Git up and running by Anirudh Rowjee](https://rowjee.com/blog/git_up_and_running)
- [ACM git blog by Saijyoti and Pranav V Bhat](https://acmpesuecc.github.io/posts/git-in-action)
<br>
- [Setting up git](https://www.theodinproject.com/lessons/foundations-setting-up-git)
- [Intro to git](https://www.theodinproject.com/lessons/foundations-introduction-to-git)
- [Git basics](https://www.theodinproject.com/lessons/foundations-git-basics)

Also when `git commit`ing, professionals usually follow a convention for commit messages
- [Conventional Commits
](https://www.conventionalcommits.org/en/v1.0.0/)
- [qoomon - Conventional Commit Messages
](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13)

## General Info
### Some common commands -
- Syncing your branch: `git pull origin main`
- Switching branches: `git checkout branch-name`
- To create and switch: `git checkout -b branch name`

### Creating a PR -
- **Before creating a PR:** update your branch with the latest main - `git pull origin main`
- make sure the follow the PR template and fill in the description of the PR
- Follow [`conventional commits`](https://www.conventionalcommits.org/en/v1.0.0/)

## Recommended Git Workflow
### Working on a new feature - 
- create branch named `your-name/feat-name`
- push changes to branch
- create a PR to the `dev` branch
- once all ongoing features have been merged into `dev` and tested, create PR to `main`

### Cleaning up
- Once the PR for a feature has been merged, ideally delete the branch