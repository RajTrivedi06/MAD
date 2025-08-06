import { LabMatch } from "../types/labMatch";

export function useLabValidation() {
  const validateLab = (lab: LabMatch): boolean => {
    // Check for required citations
    if (!lab.citations || lab.citations.length === 0) {
      console.warn(`Lab ${lab.labTitle} has no citations - likely fake data`);
      return false;
    }

    // Check for wisc.edu domain in citations
    const hasWiscEduSource = lab.citations.some(
      (citation) => citation.url && citation.url.includes("wisc.edu")
    );

    if (!hasWiscEduSource) {
      console.warn(
        `Lab ${lab.labTitle} has no wisc.edu sources - likely fake data`
      );
      return false;
    }

    // Check for suspicious patterns in email
    if (lab.contactEmail) {
      const emailPattern =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(wisc\.edu|wisconsin\.edu)$/;
      if (!emailPattern.test(lab.contactEmail)) {
        console.warn(
          `Lab ${lab.labTitle} has invalid email domain: ${lab.contactEmail}`
        );
        return false;
      }
    }

    // Check lab URL is from wisc.edu
    if (lab.labUrl && !lab.labUrl.includes("wisc.edu")) {
      console.warn(`Lab ${lab.labTitle} has non-UW URL: ${lab.labUrl}`);
      return false;
    }

    // Check for generic/placeholder content
    const genericPhrases = [
      "cutting-edge research",
      "state-of-the-art",
      "innovative solutions",
      "groundbreaking work",
      "revolutionary",
      "pioneering",
      "transformative",
      "next-generation",
      "advanced technology",
      "sophisticated algorithms",
    ];

    const hasGenericContent = genericPhrases.some(
      (phrase) =>
        lab.blurb.toLowerCase().includes(phrase) ||
        lab.whyMatch.toLowerCase().includes(phrase)
    );

    if (hasGenericContent && !lab.citations.length) {
      console.warn(`Lab ${lab.labTitle} has generic content without citations`);
      return false;
    }

    // Check for suspicious lab names (too generic or AI-like)
    const suspiciousLabNames = [
      "advanced research lab",
      "innovative solutions lab",
      "cutting-edge laboratory",
      "next-gen research group",
      "pioneering research lab",
    ];

    const hasSuspiciousName = suspiciousLabNames.some((name) =>
      lab.labTitle.toLowerCase().includes(name)
    );

    if (hasSuspiciousName) {
      console.warn(`Lab ${lab.labTitle} has suspicious generic name`);
      return false;
    }

    // Check for realistic PI names (not too generic)
    const genericPINames = [
      "dr. smith",
      "dr. johnson",
      "dr. williams",
      "dr. brown",
      "dr. jones",
      "professor smith",
      "professor johnson",
    ];

    const hasGenericPIName = genericPINames.some((name) =>
      lab.piName.toLowerCase().includes(name)
    );

    if (hasGenericPIName && !lab.citations.length) {
      console.warn(`Lab ${lab.labTitle} has generic PI name without citations`);
      return false;
    }

    // Check for realistic department names
    const validDepartments = [
      "computer sciences",
      "computer science",
      "electrical and computer engineering",
      "electrical engineering",
      "mechanical engineering",
      "biomedical engineering",
      "chemical engineering",
      "industrial engineering",
      "civil engineering",
      "materials science",
      "physics",
      "mathematics",
      "statistics",
      "biochemistry",
      "biology",
      "chemistry",
    ];

    const hasValidDepartment = validDepartments.some((dept) =>
      lab.department.toLowerCase().includes(dept)
    );

    if (!hasValidDepartment) {
      console.warn(
        `Lab ${lab.labTitle} has invalid department: ${lab.department}`
      );
      return false;
    }

    // Check for realistic fit scores (not all perfect scores)
    if (lab.fitScore > 95 && !lab.citations.length) {
      console.warn(
        `Lab ${lab.labTitle} has suspiciously high fit score without citations`
      );
      return false;
    }

    // Check for realistic research areas (not too generic)
    const genericResearchAreas = [
      "artificial intelligence",
      "machine learning",
      "data science",
      "computer vision",
      "natural language processing",
    ];

    const hasOnlyGenericAreas = lab.researchAreas.every((area) =>
      genericResearchAreas.some((generic) =>
        area.toLowerCase().includes(generic)
      )
    );

    if (hasOnlyGenericAreas && lab.researchAreas.length <= 2) {
      console.warn(`Lab ${lab.labTitle} has only generic research areas`);
      return false;
    }

    return true;
  };

  const validateAndFilterLabs = (labs: LabMatch[]): LabMatch[] => {
    const validLabs = labs.filter(validateLab);

    if (validLabs.length === 0 && labs.length > 0) {
      console.error("All labs failed validation - likely receiving fake data");
      // Return empty array to indicate no valid labs
    }

    const invalidCount = labs.length - validLabs.length;
    if (invalidCount > 0) {
      console.warn(
        `Filtered out ${invalidCount} invalid labs out of ${labs.length} total`
      );
    }

    return validLabs;
  };

  const getValidationSummary = (
    labs: LabMatch[]
  ): {
    total: number;
    valid: number;
    invalid: number;
    validationRate: number;
  } => {
    const validLabs = labs.filter(validateLab);
    const total = labs.length;
    const valid = validLabs.length;
    const invalid = total - valid;
    const validationRate = total > 0 ? (valid / total) * 100 : 0;

    return {
      total,
      valid,
      invalid,
      validationRate,
    };
  };

  const isDataAuthentic = (labs: LabMatch[]): boolean => {
    if (labs.length === 0) return true; // Empty results are acceptable

    const summary = getValidationSummary(labs);

    // Consider data authentic if at least 80% of labs pass validation
    // or if we have at least 2 valid labs
    return summary.validationRate >= 80 || summary.valid >= 2;
  };

  return {
    validateLab,
    validateAndFilterLabs,
    getValidationSummary,
    isDataAuthentic,
  };
}
