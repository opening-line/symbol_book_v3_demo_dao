import type { Context } from "hono"

export const createAdmin = async (c: Context) => {
  // TODO: DAO アカウントの生成

  // TODO: 100XYMをDAOアカウントに入金

  // TODO: ガバナンストークンの生成

  // TODO: 会員証NFTの生成

  // TODO: DAOアカウントをマルチシグに変換

  // TODO: Vote先アカウントの生成

  // TODO: Vote先アカウントをDAOアカウントにリンク

  return c.json({ message: "Hello, World!" })
}
