import * as React from "react";
import { BlobLine } from "sourcegraph/blob/BlobLine";
import testdataContents from "sourcegraph/blob/testdata/BlobLine-contents.json";
import testdataEmpty from "sourcegraph/blob/testdata/BlobLine-empty.json";
import testdataLineNumber from "sourcegraph/blob/testdata/BlobLine-lineNumber.json";
import testdataLineSelection from "sourcegraph/blob/testdata/BlobLine-selection.json";
import { autotest } from "sourcegraph/util/testutil/autotest";

const common = {
	location: {
		hash: "",
		key: "",
		pathname: "",
		search: "",
		action: "",
		query: {},
		state: {},
	},
	startByte: 0,
	highlightedDefObj: null,
};

describe("BlobLine", () => {
	it("should render", () => {
		autotest(testdataContents, "sourcegraph/blob/testdata/BlobLine-contents.json",
			<BlobLine {...common} contents={"hello\nworld"} highlightedDef="secondURL" />,
			{}
		);
	});

	it("should render empty", () => {
		autotest(testdataEmpty, "sourcegraph/blob/testdata/BlobLine-empty.json",
			<BlobLine {...common} contents={"hello\nworld"} highlightedDef={null} />,
			{}
		);
	});

	it("should render line number", () => {
		autotest(testdataLineNumber, "sourcegraph/blob/testdata/BlobLine-lineNumber.json",
			<BlobLine {...common} lineNumber={42} repo="r" rev="v" path="p" contents={"hello\nworld"} highlightedDef={null} />,
			{}
		);
	});

	it("should render selection", () => {
		autotest(testdataLineSelection, "sourcegraph/blob/testdata/BlobLine-selection.json",
			<BlobLine {...common} contents={"hello\nworld"} selected={true} highlightedDef={null} />,
			{}
		);
	});
});
