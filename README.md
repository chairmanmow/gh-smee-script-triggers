# Git Watch Custom CI

This sub-project kicks off builds automatically from github actions using github webhooks via a proxy.  Being able to understand or run this project isn't needed to work on Companion. 

In other words, this subproject is fairly decoupled from the app + configurable it's building, and could be used to hook into git webhooks in other repositories and kick off scripts without too many changes.

This script doesn't contain actual build logic, those functions are delegated to bash scripts, which may have additional dependencies.  

### This app wraps some shell functions, for it to work properly you should have these dependencies

- Github CLI to be able to run `gh` command
- Smee client to be able to connect to webhook proxy using `smee` command

### Also, If you want to try running this, it's recommend to copy this directory outside of the project and run it there.
- You will likely have to edit some paths in the `environment.js` file to make it work for your system

