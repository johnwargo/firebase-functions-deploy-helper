# Firebase Functions Deployment Helper (FFDH)

A simple Node CLI that simplifies the process of deploying Firebase Functions for large projects.

As I started work on my first Firebase project, I quickly had a catalog of 57 functions I regularly deployed. Seemingly depending on how many functions I'd modified since my least deploy or on the time of day, I regularly received deployment errors and the `firebase deploy` command rarely deployed all of my functions. In seeking help from Google, I learned that there are [quota limits](https://firebase.google.com/docs/functions/quotas#quota_limits_for_firebase_cli_deployment) when deploying functions:

For each function that the Firebase CLI deploys, these types of rate and time limits are affected:

- API calls (READ) - 1 call per deployment, no matter how many functions
  - Limit: 5000 per 100 seconds
- API calls (WRITE) - 1 call per function
  - Limit: 80 per 100 seconds

Google's recommendation is to deploy the functions in batches, but since I was hacking around in my functions it was rather difficult to keep track of what I wanted to deploy and a pain to type the long batch deploy command:

```shell
firebase deploy --only functions:function1,functions:function2,functions:function3,functions:functionX
```

I found that if I did a full deploy multiple times, it would randomly fail on a different set of functions each time and I could deploy everything (usually) with two of these:

```shell
firebase deploy --only functions
```

Not the best solution, but it worked (most of the time); it just took too long for me.

After a while, it occurred to me that I could automate some of this. My functions catalog is organized around my backend application's record types (companies, contacts, campaigns, etc.) so I thought first about using command files (`.cmd`, `.bat`, `.sh`) for the different groups, but that would be a pain to implement and maintain. I didn't want 10 `.cmd` and 10 `.sh` scripts hanging around in my project. Also, sometimes I'd modify all of the project's `get` functions, so that approach wouldn't work there.

I decided to build a simple CLI that enabled me to publish a subset of my functions - and here we are.

The CLI command delivered here is `ffdh` (Firebase Functions Deployment Helper); it allows you to:

* Deploy functions in batches. For example, you can define 5 batches, then issue separate commands to deploy each one of the batches. If you wait enough time between deploys (100 seconds as shown in the content above) then you can get around the Firebase quota limitations.
* Deploy functions based on the start and/or the end of function names in your project

## Installation

To install the module, open a terminal window or command prompt and execute the following command:

```shell
npm install -g ffdh
```

This installs the `ffdh` command in the global scope.

## Initialization

To operate, the `ffdh` command requires access to the list of functions in your project. I know I could parse the imports in the project's `functions/index.js` or `functions/index.ts` file to build that list, but since Google recommends several ways to [organize multiple functions](https://firebase.google.com/docs/functions/organize-functions), I knew I couldn't accurately do this for all projects. Instead, I decided to use a simple JSON array maintained by the developer (that's you) for my list of function names.

To initialize your project to use this module, create a file called `functions.json` in your Firebase project folder (the project root, not the `functions` folder). Populate the file with a JSON array of function names as shown in the following example:

```typescript
[
    "companyDelete",
    "companyFind",
    "companyGet",
    "companyList",
    "companyUpdate",
    "contactDelete",
    "contactFind",
    "contactGet",
    "contactList",
    "contactUpdate",
    "dashGetStats"
]
```

**Note:** It doesn't matter if the list is sorted, but I sorted mine just because.

Unfortunately, you'll have to manually manage this file's content as you add and delete functions from your project. If you want to propose an accurate (and easy to maintain) mechanism to do this automatically, please submit a pull request.

## Usage

The `ffdh` command supports the following command-line options:

* `-V`, `--version`: Display the module's version number
* `-s`, `--start`: Search the start of function name for a specific string
* `-e`, `--end`: Search end of function name for a specific string
* `-b`, `--batches`: Deploy a batch of functions of a specific size
* `-bn`, `--batch`: The batch number to deploy
* `-d`, `--debug`: Enable debug mode which displays additional information to the console during processing
* `-h`, `--help`: Displays help content

The following sections describe how to use them.

### Deploying Functions in Batches

If you have a big Functions project, the easiest way to deploy all the functions is to do them in batches.  With batch deployment, you decide how many batches you want and the program automatically manages deploying the right number of functions for each batch.

Say for example that you wanted to deploy your functions in 4 batches, open a terminal window or command prompt in your Firebase project folder then execute the following command:

```shell
ffdh -b 4
```

This tells the deployment helper that you want to deploy in 4 batches and to deploy the first batch (when you omit the batch number [`-bn`], the helper assumes you want to deploy the first batch). The helper figures out how many functions to deploy in each batch, then gets to work. It doesn't do anything to deploy functions evenly across batches, so depending on the number of functions in your project, the last batch could be pretty small.

You can also accomplish the same thing using the following command:

```shell
ffdh -b 4 -bn 1
```

To deploy subsequent batches, wait a little time to let Firebase reset its quota timer (which looks to be 100 seconds if the documentation is correct) then repeat the command using a different batch number:

```shell
ffdh -b 4 -bn 2
```

To deploy the functions, the helper simply builds that knarly `firebase deploy` command shown earlier, then executes the command.

### Deploying Functions via Search

Sometimes you make changes to groups of functions, either functions that perform similar functions against different tables, or functions for a particular application area. The deployment helper accommodates this use case using search. When deploying functions, you can chose to select functions for deployment using a search string applied to the start and/or end of the function name.

For example, to deploy all of the `company` functions in the project (shown in the functions list displayed earlier), you can deploy them using the following command:

```shell
ffdh -s company
```

This deploys all functions whose names begin with `company` ; in this example: the `companyDelete`, `companyFind`, `companyGet`, `companyList`, `companyUpdate` functions.

If you recently modified all of the `Get` functions in the project, then you can deploy them using the following command:

```shell
ffdh -e Get
```

This deploys all functions in the project that end with the specified string; in this example: the `companyGet` and `contactGet` functions.

You can also deploy functions using search strings for both the start and end of the function name:

```shell
ffdh -s company -e e
```

In this silly example, the helper would deploy all functions that started with `company` and ended with `e` which, for this example, happens to be `companyDelete` and `companyUpdate`.

***

You can find information on many different topics on my [personal blog](http://www.johnwargo.com). Learn about all of my publications at [John Wargo Books](http://www.johnwargobooks.com).

If you find this code useful and feel like thanking me for providing it, please consider <a href="https://www.buymeacoffee.com/johnwargo" target="_blank">Buying Me a Coffee</a>, or making a purchase from [my Amazon Wish List](https://amzn.com/w/1WI6AAUKPT5P9).