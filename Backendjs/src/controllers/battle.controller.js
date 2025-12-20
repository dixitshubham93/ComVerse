import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createBattle = async (req, res) => {
  try {
    const { roomId, post1Id, post2Id, expiresAt } = req.body;
    
    const battle = await prisma.battle.create({
      data: {
        roomId: BigInt(roomId),
        post1Id: BigInt(post1Id),
        post2Id: BigInt(post2Id),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        post1: true,
        post2: true,
      }
    });

    res.status(201).json({
      success: true,
      data: serializeBattle(battle)
    });
  } catch (error) {
    console.error("Error creating battle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBattlesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const battles = await prisma.battle.findMany({
      where: { roomId: BigInt(roomId) },
      include: {
        post1: {
          include: { user: true }
        },
        post2: {
          include: { user: true }
        },
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Get vote counts for each post in each battle
    const battlesWithVotes = await Promise.all(battles.map(async (battle) => {
      const post1Votes = await prisma.battleVote.count({
        where: { battleId: battle.id, postId: battle.post1Id }
      });
      const post2Votes = await prisma.battleVote.count({
        where: { battleId: battle.id, postId: battle.post2Id }
      });

      return {
        ...serializeBattle(battle),
        post1Votes,
        post2Votes,
      };
    }));

    res.json({
      success: true,
      data: battlesWithVotes
    });
  } catch (error) {
    console.error("Error fetching battles:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const voteInBattle = async (req, res) => {
  try {
    const { battleId, postId } = req.body;
    const userId = req.user.id;

    const vote = await prisma.battleVote.upsert({
      where: {
        battleId_userId: {
          battleId: BigInt(battleId),
          userId: BigInt(userId),
        }
      },
      update: {
        postId: BigInt(postId),
      },
      create: {
        battleId: BigInt(battleId),
        userId: BigInt(userId),
        postId: BigInt(postId),
      }
    });

    res.json({
      success: true,
      data: serializeVote(vote)
    });
  } catch (error) {
    console.error("Error voting in battle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to serialize BigInt
const serializeBattle = (battle) => ({
  ...battle,
  id: battle.id.toString(),
  roomId: battle.roomId.toString(),
  post1Id: battle.post1Id.toString(),
  post2Id: battle.post2Id.toString(),
  post1: battle.post1 ? { ...battle.post1, id: battle.post1.id.toString(), userId: battle.post1.userId.toString() } : null,
  post2: battle.post2 ? { ...battle.post2, id: battle.post2.id.toString(), userId: battle.post2.userId.toString() } : null,
});

const serializeVote = (vote) => ({
  ...vote,
  id: vote.id.toString(),
  battleId: vote.battleId.toString(),
  userId: vote.userId.toString(),
  postId: vote.postId.toString(),
});
