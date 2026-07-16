import { graphqlRequest } from "@/lib/graphqlClient";

export type ChatbotHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const ASK_STOCK_BOT_MUTATION = `
  mutation AskStockBot($question: String!, $history: [ChatbotHistoryMessageInput!]) {
    askStockBot(question: $question, history: $history) {
      answer
    }
  }
`;

export async function askStockBot(
  question: string,
  history: ChatbotHistoryMessage[] = []
): Promise<string> {
  const data = await graphqlRequest<{ askStockBot: { answer: string } }>(
    ASK_STOCK_BOT_MUTATION,
    {
      question: question.trim(),
      history: history.length > 0 ? history : null,
    }
  );

  const answer = data.askStockBot?.answer?.trim();
  if (!answer) {
    throw new Error(
      "Je n’ai pas reçu de réponse. Réessayez dans un instant ou reformulez votre question."
    );
  }

  return answer;
}
