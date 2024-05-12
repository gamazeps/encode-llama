import { db } from "../postgres";
import { selectVersions } from "../postgres/versions/select";
import { VersionEntry } from "../postgres/types";

/**
 * We are not resolving output type groundLevelVersions with different values here. so we dont need groundLevelVersionResolvers
 */
export async function groundLevelVersionsQuery(): Promise<VersionEntry[]> {
    return await selectVersions(db);
}
