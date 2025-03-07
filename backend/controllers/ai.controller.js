import * as aiService from "../services/ai.service.js";

export const getResult = async (req, res) => {
  console.log(req.body);
  const { prompt } = req.body;
  const result = await aiService.generateResult(prompt);
  res.json({ result });
};
