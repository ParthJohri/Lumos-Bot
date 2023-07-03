const axios = require("axios");

async function fetchData() {
  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query: `query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            userStatus
            link
            question {
              acRate
              difficulty
              freqBar
              frontendQuestionId: questionFrontendId
              isFavor
              paidOnly: isPaidOnly
              status
              title
              titleSlug
              hasVideoSolution
              hasSolution
              topicTags {
                name
                id
                slug
              }
              content
            }
          }
        }`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = response.data;
    const question = data.data.activeDailyCodingChallengeQuestion.question;

    const result = {
      date: data.data.activeDailyCodingChallengeQuestion.date,
      userStatus: data.data.activeDailyCodingChallengeQuestion.userStatus,
      link: data.data.activeDailyCodingChallengeQuestion.link,
      question: {
        acRate: question.acRate,
        difficulty: question.difficulty,
        freqBar: question.freqBar,
        title: question.title,
        titleSlug: question.titleSlug,
        topicTags: question.topicTags.map((tag) => ({
          name: tag.name,
        })),
        content: question.content,
      },
    };

    return result;
  } catch (error) {
    // Handle any errors that occur during the request
    console.error(error);
    return null;
  }
}
module.exports = {
  fetchData: fetchData,
};
