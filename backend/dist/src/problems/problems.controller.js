"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemsController = void 0;
const common_1 = require("@nestjs/common");
const problems_service_1 = require("./problems.service");
const create_problem_dto_1 = require("./dto/create-problem.dto");
const update_problem_dto_1 = require("./dto/update-problem.dto");
let ProblemsController = class ProblemsController {
    problemsService;
    constructor(problemsService) {
        this.problemsService = problemsService;
    }
    create(createProblemDto) {
        return this.problemsService.create(createProblemDto);
    }
    findAll() {
        return this.problemsService.findAll();
    }
    findSubmissions(slug) {
        return this.problemsService.findSubmissions(slug);
    }
    updateSubmissionSolution(slug, id, body) {
        return this.problemsService.updateSubmissionSolution(slug, id, body.isSolution, body.solutionName);
    }
    findSolutions(slug) {
        return this.problemsService.findSolutions(slug);
    }
    findOne(slug) {
        return this.problemsService.findOne(slug);
    }
    findById(id) {
        return this.problemsService.findById(id);
    }
    update(id, updateProblemDto) {
        return this.problemsService.update(id, updateProblemDto);
    }
    remove(id) {
        return this.problemsService.remove(id);
    }
};
exports.ProblemsController = ProblemsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_problem_dto_1.CreateProblemDto]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':slug/submissions'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findSubmissions", null);
__decorate([
    (0, common_1.Patch)(':slug/submissions/:id/solution'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "updateSubmissionSolution", null);
__decorate([
    (0, common_1.Get)(':slug/solutions'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findSolutions", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('id/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_problem_dto_1.UpdateProblemDto]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "remove", null);
exports.ProblemsController = ProblemsController = __decorate([
    (0, common_1.Controller)('problems'),
    __metadata("design:paramtypes", [problems_service_1.ProblemsService])
], ProblemsController);
//# sourceMappingURL=problems.controller.js.map