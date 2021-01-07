---
title: Contributing via pull requests
weight: 1
---

## Pull Request Checklist
You are able to implement a new feature or fix an issue by pull requests, before sending pull requests, make sure you followed this list
- Read [contributing guidelines](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/CONTRIBUTING.md)
- Read [Code of Conduct](https://aws.github.io/code-of-conduct)
- Write unit test cases and make sure the unit test is passed
- It is mandatory to output solution id. [Here](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/edge/nodejs/modify-response-header/template.yaml#L55) is an example, you only need to replace the SolutionId Value with yours


To send us a pull request by doing the following:

## Fork the repository
1. On GitHub, navigate to the [awslabs/aws-cloudfront-extensions](https://github.com/awslabs/aws-cloudfront-extensions) repository
2. In the top right of the page, choose **Fork**
    ![Fork](/fork.png)
   
## Make changes and test
1. Clone the forked repository and make code changes
2. Run `npm test` or `pytest` depends on your language and make sure the unit test is passed
   ![Unit Test](/unit_test.png)
3. Output your unique solution id in yaml file
   ![Output SolutionId](/output_sid.png)
4. Commit to your fork repository

## Send a pull request
1. Navigate to [awslabs/aws-cloudfront-extensions](https://github.com/awslabs/aws-cloudfront-extensions) where you created your fork
2. Choose **New pull request**
    ![New PR](/new_pr.png)
3. Choose **compare across forks**
4. In the "head fork" drop-down menu, select your fork, then use the "compare branch" drop-down menu to select the branch you made your changes in
   ![Across Forks](/across_forks.png)
5. Type in the title and description by following [PR template](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/.github/pull_request_template.md) and create the pull request
   ![PR Example](/pr_example.png)
6. Apply a label for your pull request. The label naming format is <language>/<functionName>, which is also the folder contains your code
   ![PR Label](/pr_label.png)
7. Keep tracking until your pull request is approved and merged   


