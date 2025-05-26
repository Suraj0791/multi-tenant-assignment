import React from "react";

const TaskCategoryPriority = ({ formData, handleChange, categories }) => {
  return (
    <>
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <select
          name="category"
          id="category"
          required
          className="input mt-1"
          value={formData.category || ""}
          onChange={handleChange}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-gray-700"
        >
          Priority
        </label>
        <select
          name="priority"
          id="priority"
          className="input mt-1"
          value={formData.priority || "medium"}
          onChange={handleChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </>
  );
};

export default TaskCategoryPriority;
