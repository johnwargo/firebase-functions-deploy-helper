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
firebase deploy --only functions:function1,functions:function2,functions:function3,functions:functionx
```

I found that if I did a full deploy multiple times, it would randomly fail on a different set of functions each time and I could deploy everything (usually) with two of these:

```shell
firebase deploy --only functions
```

Not the best solution, but it worked.

After a while, it occurred to me that I could automate some of this. My functions catalog is organized around my backend application's record types (companies, contacts, campaigns, etc.) so I thought first about using command files (`.cmd`, `.bat`, `.sh`) for the different groups, but that would be a pain to implement and maintain. I didn't want 10 `.cmd` and 10 `.sh` scripts hanging around in my project. Also, sometimes I'd modify all of the project's `get` functions, so that approach wouldn't work there.

I decided to build a simple CLI that enabled me to publish a subset of my functions - and here we are.

The CLI command delivered here is `ffdh` (Firebase Functions Deployment Helper)



***

You can find information on many different topics on my [personal blog](http://www.johnwargo.com). Learn about all of my publications at [John Wargo Books](http://www.johnwargobooks.com).

If you find this code useful and feel like thanking me for providing it, please consider <a href="https://www.buymeacoffee.com/johnwargo" target="_blank">Buying Me a Coffee</a>, or making a purchase from [my Amazon Wish List](https://amzn.com/w/1WI6AAUKPT5P9).