import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const userIdHeader = req.header("x-user-id");

  if (!userIdHeader) {
    return res.status(401).json({ message: "Missing x-user-id header" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userIdHeader) },
      include: { student: true, teacher: true }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "User is blocked" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
